package model

import (
	"time"
)

type Staff struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID         string    `gorm:"type:varchar(36);uniqueIndex;not null" json:"uuid"`
	Username     string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	IsActivate   bool      `gorm:"default:false;not null" json:"is_activate"`
	RoleID       *uint     `gorm:"index" json:"role_id"`
	Role         *Role     `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Staff) TableName() string {
	return "staff"
}

type StaffResponse struct {
	ID         uint      `json:"id"`
	UUID       string    `json:"uuid"`
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	IsActivate bool      `json:"is_activate"`
	RoleID     *uint     `json:"role_id,omitempty"`
	Role       *Role     `json:"role,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (s *Staff) ToResponse() StaffResponse {
	return StaffResponse{
		ID:         s.ID,
		UUID:       s.UUID,
		Username:   s.Username,
		Name:       s.Name,
		IsActivate: s.IsActivate,
		RoleID:     s.RoleID,
		Role:       s.Role,
		CreatedAt:  s.CreatedAt,
		UpdatedAt:  s.UpdatedAt,
	}
}

type CreateStaffRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=1,max=100"`
	RoleID   *uint  `json:"role_id,omitempty"`
}

type UpdateStaffRequest struct {
	Name       *string `json:"name,omitempty"`
	Password   *string `json:"password,omitempty"`
	IsActivate *bool   `json:"is_activate,omitempty"`
	RoleID     *uint   `json:"role_id,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	Staff StaffResponse `json:"staff"`
	Admin StaffResponse `json:"admin"` // backward-compatible alias for older frontend code
}
