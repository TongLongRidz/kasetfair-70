package model

import (
	"time"
)

// Promotion represents a reward/discount promotion based on points or campaign
type Promotion struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	NameTh      string    `gorm:"type:varchar(150);not null" json:"name_th"`
	NameEn      string    `gorm:"type:varchar(150);not null" json:"name_en"`
	DescTh      *string   `gorm:"type:text" json:"desc_th"`
	DescEn      *string   `gorm:"type:text" json:"desc_en"`
	PointUsage  int       `gorm:"type:int;default:0;not null" json:"point_usage"`
	AllLimit    *int      `gorm:"type:int" json:"all_limit"`
	PersonLimit *int      `gorm:"type:int" json:"person_limit"`
	StartDate   *time.Time `gorm:"type:timestamptz" json:"start_date"`
	EndDate     *time.Time `gorm:"type:timestamptz" json:"end_date"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Associations
	Redemptions []PromotionRedemption `gorm:"foreignKey:PromotionID;constraint:OnDelete:CASCADE" json:"redemptions,omitempty"`
}

func (Promotion) TableName() string {
	return "promotion"
}

// PromotionRedemption records customer promotion redemptions
type PromotionRedemption struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	PromotionID uint      `gorm:"not null;index" json:"promotion_id"`
	CustomerID  uint      `gorm:"not null;index" json:"customer_id"`
	RedeemedAt  time.Time `gorm:"autoCreateTime" json:"redeemed_at"`

	// Associations
	Promotion *Promotion `gorm:"foreignKey:PromotionID" json:"promotion,omitempty"`
	Customer  *Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

func (PromotionRedemption) TableName() string {
	return "promotion_redemption"
}

// Customer model representing customers in loyalty/point system
type Customer struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	PhoneNumber     string    `gorm:"type:varchar(20);uniqueIndex;not null" json:"phone_number"`
	Name            *string   `gorm:"type:varchar(100)" json:"name"`
	CurrentPoints   int       `gorm:"default:0;not null" json:"current_points"`
	TotalCupsBought int       `gorm:"default:0;not null" json:"total_cups_bought"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	LatestBoughtAt  time.Time `gorm:"autoCreateTime" json:"latest_bought_at"`
}

func (Customer) TableName() string {
	return "customer"
}

// DTOs for Promotion
type CreatePromotionRequest struct {
	NameTh      string     `json:"name_th" binding:"required,min=1,max=150"`
	NameEn      string     `json:"name_en"`
	DescTh      *string    `json:"desc_th"`
	DescEn      *string    `json:"desc_en"`
	PointUsage  int        `json:"point_usage" binding:"min=0"`
	AllLimit    *int       `json:"all_limit"`
	PersonLimit *int       `json:"person_limit"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	IsActive    *bool      `json:"is_active"`
}

type UpdatePromotionRequest struct {
	NameTh      *string    `json:"name_th"`
	NameEn      *string    `json:"name_en"`
	DescTh      *string    `json:"desc_th"`
	DescEn      *string    `json:"desc_en"`
	PointUsage  *int       `json:"point_usage"`
	AllLimit    *int       `json:"all_limit"`
	PersonLimit *int       `json:"person_limit"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	IsActive    *bool      `json:"is_active"`
}

type PromotionResponse struct {
	ID          uint       `json:"id"`
	NameTh      string     `json:"name_th"`
	NameEn      string     `json:"name_en"`
	DescTh      *string    `json:"desc_th"`
	DescEn      *string    `json:"desc_en"`
	PointUsage  int        `json:"point_usage"`
	AllLimit    *int       `json:"all_limit"`
	PersonLimit *int       `json:"person_limit"`
	UsedCount   int64      `json:"used_count"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
