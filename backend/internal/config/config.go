package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port       string
	AppEnv     string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode     string
	JWTSecret     string
	RedisHost     string
	RedisPort     string
	RedisPassword string
}

func LoadConfig() *Config {
	// Try loading .env from current directory first, or root directory
	if err := godotenv.Load(); err != nil {
		if errRoot := godotenv.Load("../.env"); errRoot != nil {
			log.Println("Note: .env file not found or could not be loaded, reading from environment")
		}
	}

	return &Config{
		Port:          getEnv("PORT", "8585"),
		AppEnv:        getEnv("APP_ENV", "development"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5488"),
		DBUser:        getEnv("DB_USER", "kaset_user"),
		DBPassword:    getEnv("DB_PASSWORD", "kaset_secret_pass"),
		DBName:        getEnv("DB_NAME", "kaset_db"),
		DBSSLMode:     getEnv("DB_SSLMODE", "disable"),
		JWTSecret:     getEnv("JWT_SECRET", "kaset_fair_super_secret_jwt_key_2570"),
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6389"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
	}
}

func (c *Config) GetPostgresDSN() string {
	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Bangkok",
		c.DBHost,
		c.DBUser,
		c.DBPassword,
		c.DBName,
		c.DBPort,
		c.DBSSLMode,
	)
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultVal
}
