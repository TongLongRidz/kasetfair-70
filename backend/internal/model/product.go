package model

import (
	"time"
)

// Product represents both regular drinks and combo sets
type Product struct {
	ID            uint                 `gorm:"primaryKey;autoIncrement" json:"id"`
	NameTh        string               `gorm:"type:varchar(150);not null" json:"name_th"`
	NameEn        string               `gorm:"type:varchar(150);not null" json:"name_en"`
	DescTh        *string              `gorm:"type:text" json:"desc_th"`
	DescEn        *string              `gorm:"type:text" json:"desc_en"`
	PriceHot      *int                 `gorm:"type:int" json:"price_hot"`
	PriceIced     *int                 `gorm:"type:int" json:"price_iced"`
	ImageURL      *string              `gorm:"type:varchar(255)" json:"image_url"`
	IsCombo       bool                 `gorm:"default:false;not null" json:"is_combo"`
	IsAvailable   bool                 `gorm:"default:true;not null" json:"is_available"`
	IsSoldOut     bool                 `gorm:"default:false;not null" json:"is_sold_out"`
	IsRecommended bool                 `gorm:"default:false;not null" json:"is_recommended"`
	SortOrder     int                  `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt     time.Time            `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time            `gorm:"autoUpdateTime" json:"updated_at"`
	ComboRecipes  []ProductComboRecipe `gorm:"foreignKey:ComboProductID;constraint:OnDelete:CASCADE" json:"combo_recipes,omitempty"`
}

func (Product) TableName() string {
	return "product"
}

// ProductComboRecipe represents recipe components for combo set products
type ProductComboRecipe struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ComboProductID uint      `gorm:"not null;index" json:"combo_product_id"`
	BaseProductID  uint      `gorm:"not null;index" json:"base_product_id"`
	ToppingID      uint      `gorm:"not null;index" json:"topping_id"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Associations
	BaseProduct *Product `gorm:"foreignKey:BaseProductID" json:"base_product,omitempty"`
	Topping     *Topping `gorm:"foreignKey:ToppingID" json:"topping,omitempty"`
}

func (ProductComboRecipe) TableName() string {
	return "product_combo_recipes"
}

// Topping represents optional add-on toppings
type Topping struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	NameTh      string    `gorm:"type:varchar(100);not null" json:"name_th"`
	NameEn      string    `gorm:"type:varchar(100);not null" json:"name_en"`
	Price       int       `gorm:"type:int;default:0;not null" json:"price"`
	AllowHot    bool      `gorm:"type:boolean;not null" json:"allow_hot"`
	AllowIced   bool      `gorm:"type:boolean;not null" json:"allow_iced"`
	ImageURL    *string   `gorm:"type:varchar(255)" json:"image_url"`
	IsAvailable bool      `gorm:"type:boolean;not null" json:"is_available"`
	IsSoldOut   bool      `gorm:"type:boolean;not null" json:"is_sold_out"`
	SortOrder   int       `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Topping) TableName() string {
	return "topping"
}

// DTOs for Products
type CreateProductRequest struct {
	NameTh        string  `json:"name_th" binding:"required,min=1,max=150"`
	NameEn        string  `json:"name_en"`
	DescTh        *string `json:"desc_th"`
	DescEn        *string `json:"desc_en"`
	PriceHot      *int    `json:"price_hot"`
	PriceIced     *int    `json:"price_iced"`
	ImageURL      *string `json:"image_url"`
	IsCombo       bool    `json:"is_combo"`
	IsAvailable   *bool   `json:"is_available"`
	IsSoldOut     *bool   `json:"is_sold_out"`
	IsRecommended *bool   `json:"is_recommended"`
	SortOrder     *int    `json:"sort_order"`
	BaseProductID *uint   `json:"base_product_id"`
	ToppingIDs    []uint  `json:"topping_ids"`
}

type UpdateProductRequest struct {
	NameTh        *string `json:"name_th"`
	NameEn        *string `json:"name_en"`
	DescTh        *string `json:"desc_th"`
	DescEn        *string `json:"desc_en"`
	PriceHot      *int    `json:"price_hot"`
	PriceIced     *int    `json:"price_iced"`
	ImageURL      *string `json:"image_url"`
	IsCombo       *bool   `json:"is_combo"`
	IsAvailable   *bool   `json:"is_available"`
	IsSoldOut     *bool   `json:"is_sold_out"`
	IsRecommended *bool   `json:"is_recommended"`
	SortOrder     *int    `json:"sort_order"`
	BaseProductID *uint   `json:"base_product_id"`
	ToppingIDs    *[]uint `json:"topping_ids"`
}

type ReorderProductItem struct {
	ID        uint `json:"id" binding:"required"`
	SortOrder int  `json:"sort_order"`
}

type ReorderProductsRequest struct {
	Items []ReorderProductItem `json:"items" binding:"required"`
}

type ReorderToppingItem struct {
	ID        uint `json:"id" binding:"required"`
	SortOrder int  `json:"sort_order"`
}

type ReorderToppingsRequest struct {
	Items []ReorderToppingItem `json:"items" binding:"required"`
}

// DTOs for Toppings
type CreateToppingRequest struct {
	NameTh      string  `json:"name_th" binding:"required,min=1,max=100"`
	NameEn      string  `json:"name_en"`
	Price       int     `json:"price" binding:"min=0"`
	AllowHot    *bool   `json:"allow_hot"`
	AllowIced   *bool   `json:"allow_iced"`
	ImageURL    *string `json:"image_url"`
	IsAvailable *bool   `json:"is_available"`
	IsSoldOut   *bool   `json:"is_sold_out"`
	SortOrder   *int    `json:"sort_order"`
}

type UpdateToppingRequest struct {
	NameTh      *string `json:"name_th"`
	NameEn      *string `json:"name_en"`
	Price       *int    `json:"price"`
	AllowHot    *bool   `json:"allow_hot"`
	AllowIced   *bool   `json:"allow_iced"`
	ImageURL    *string `json:"image_url"`
	IsAvailable *bool   `json:"is_available"`
	IsSoldOut   *bool   `json:"is_sold_out"`
	SortOrder   *int    `json:"sort_order"`
}
