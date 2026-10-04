package model

import (
	"time"
)

type Admin struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID         string    `gorm:"type:varchar(36);uniqueIndex;not null" json:"uuid"`
	Username     string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	IsActivate   bool      `gorm:"default:false;not null" json:"is_activate"`
	IsSuperadmin bool      `gorm:"default:false;not null" json:"is_superadmin"`
	RoleID       *uint     `gorm:"index" json:"role_id"`
	Role         *Role     `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Admin) TableName() string {
	return "admin"
}

type AdminResponse struct {
	ID           uint      `json:"id"`
	UUID         string    `json:"uuid"`
	Username     string    `json:"username"`
	Name         string    `json:"name"`
	IsActivate   bool      `json:"is_activate"`
	IsSuperadmin bool      `json:"is_superadmin"`
	RoleID       *uint     `json:"role_id,omitempty"`
	Role         *Role     `json:"role,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (a *Admin) ToResponse() AdminResponse {
	return AdminResponse{
		ID:           a.ID,
		UUID:         a.UUID,
		Username:     a.Username,
		Name:         a.Name,
		IsActivate:   a.IsActivate,
		IsSuperadmin: a.IsSuperadmin,
		RoleID:       a.RoleID,
		Role:         a.Role,
		CreatedAt:    a.CreatedAt,
		UpdatedAt:    a.UpdatedAt,
	}
}

type CreateAdminRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=1,max=100"`
	RoleID   *uint  `json:"role_id,omitempty"`
}

type UpdateAdminRequest struct {
	Name         *string `json:"name,omitempty"`
	Password     *string `json:"password,omitempty"`
	IsActivate   *bool   `json:"is_activate,omitempty"`
	IsSuperadmin *bool   `json:"is_superadmin,omitempty"`
	RoleID       *uint   `json:"role_id,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	Admin AdminResponse `json:"admin"`
}
