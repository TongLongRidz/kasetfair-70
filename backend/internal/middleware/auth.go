package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"kaset-fair-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type JWTClaims struct {
	UUID         string `json:"uuid"`
	Username     string `json:"username"`
	IsSuperadmin bool   `json:"is_superadmin"`
	jwt.RegisteredClaims
}

func GenerateToken(admin *model.Admin, secret string, duration time.Duration) (string, error) {
	claims := JWTClaims{
		UUID:         admin.UUID,
		Username:     admin.Username,
		IsSuperadmin: admin.IsSuperadmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   admin.UUID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func AuthMiddleware(db *gorm.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenString string

		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Check cookie if header not found
			cookie, err := c.Cookie("admin_token")
			if err == nil && cookie != "" {
				tokenString = cookie
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: missing token"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid token claims"})
			c.Abort()
			return
		}

		var admin model.Admin
		if err := db.Where("uuid = ?", claims.UUID).First(&admin).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: admin account not found"})
			c.Abort()
			return
		}

		if !admin.IsActivate {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is not activated. Please contact superadmin."})
			c.Abort()
			return
		}

		// Store in gin context
		c.Set("current_admin", &admin)
		c.Next()
	}
}

func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get("current_admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		admin, ok := val.(*model.Admin)
		if !ok || !admin.IsSuperadmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Superadmin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}
