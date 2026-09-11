package model

import (
	"time"
)

type SystemSetting struct {
	Key         string    `gorm:"primaryKey;type:varchar(100)" json:"key"`
	Value       string    `gorm:"type:text;not null" json:"value"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (SystemSetting) TableName() string {
	return "system_setting"
}
