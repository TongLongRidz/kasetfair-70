package model

import (
	"time"
)

type Role struct {
	ID          uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	Key         string       `gorm:"column:key;type:varchar(50);uniqueIndex;not null" json:"key"`
	NameTH      string       `gorm:"type:varchar(100)" json:"name_th"`
	NameEN      string       `gorm:"type:varchar(100)" json:"name_en"`
	Description string       `gorm:"type:varchar(255)" json:"description"`
	CreatedAt   time.Time    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at"`
	Permissions []Permission `gorm:"many2many:permission_role;foreignKey:ID;joinForeignKey:role_id;References:ID;joinReferences:permission_id" json:"permissions,omitempty"`
}

func (Role) TableName() string {
	return "role"
}

type Permission struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	NameTH      string    `gorm:"type:varchar(100)" json:"name_th"`
	NameEN      string    `gorm:"type:varchar(100)" json:"name_en"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Permission) TableName() string {
	return "permission"
}

type PermissionRole struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RoleId       uint      `gorm:"not null;index" json:"role_id"`
	PermissionId uint      `gorm:"not null;index" json:"permission_id"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (PermissionRole) TableName() string {
	return "permission_role"
}
