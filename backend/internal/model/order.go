package model

import (
	"time"
)

// Order represents main customer orders
type Order struct {
	ID                  uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID                string      `gorm:"type:varchar(36);uniqueIndex;not null" json:"uuid"`
	QueueNo             string      `gorm:"type:varchar(10);index;not null" json:"queue_no"`
	Method              string      `gorm:"type:varchar(20);not null" json:"method"` // walk-in, online, nisit-shop
	EstimatedPickupTime *time.Time  `gorm:"type:timestamptz" json:"estimated_pickup_time"`
	TotalAmount         int         `gorm:"type:int;default:0;not null" json:"total_amount"`
	PaymentMethod       string      `gorm:"type:varchar(20);not null" json:"payment_method"` // promptpay, cash
	ReceivedAmount      *int        `gorm:"type:int" json:"received_amount"`
	SlipURL                *string    `gorm:"type:varchar(255)" json:"slip_url"`
	SlipVerificationStatus string     `gorm:"type:varchar(20);index;not null;default:'pending'" json:"slip_verification_status"` // pending, verified, fraud
	SlipVerifiedBy         *uint      `gorm:"type:int" json:"slip_verified_by"`
	SlipVerifiedAt         *time.Time `gorm:"type:timestamptz" json:"slip_verified_at"`
	CheckNote              *string    `gorm:"type:text" json:"check_note"` // หมายเหตุการตรวจสอบสลิป/การชำระเงิน
	OrderStatus            string     `gorm:"type:varchar(20);index;not null;default:'new_order'" json:"order_status"` // new_order, preparing, ready, completed, cancelled
	Note                *string     `gorm:"type:text" json:"note"`
	CreatedAt           time.Time   `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt           time.Time   `gorm:"autoUpdateTime" json:"updated_at"`

	// Associations
	SlipAdmin  *Admin      `gorm:"foreignKey:SlipVerifiedBy" json:"slip_admin,omitempty"`
	OrderItems []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"order_items,omitempty"`
}

func (Order) TableName() string {
	return "order"
}

// OrderItem represents individual cups/items in an order
type OrderItem struct {
	ID             uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID        uint               `gorm:"not null;index" json:"order_id"`
	ProductID      uint               `gorm:"not null;index" json:"product_id"`
	Temperature    string             `gorm:"type:varchar(10);default:'iced';not null" json:"temperature"` // iced, hot
	SweetnessLevel string             `gorm:"type:varchar(50);default:'100%';not null" json:"sweetness_level"` // 0%, 25%, 50%, 75%, 100%
	UnitPrice      int                `gorm:"type:int;not null" json:"unit_price"`
	Quantity       int                `gorm:"type:int;default:1;not null" json:"quantity"`
	Note           *string            `gorm:"type:text" json:"note"`

	// Associations
	Order             *Order             `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Product           *Product           `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	OrderItemToppings []OrderItemTopping `gorm:"foreignKey:OrderItemID;constraint:OnDelete:CASCADE" json:"order_item_toppings,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_item"
}

// OrderItemTopping represents toppings selected for each cup
type OrderItemTopping struct {
	ID                uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderItemID       uint     `gorm:"not null;index" json:"order_item_id"`
	ToppingID         uint     `gorm:"not null;index" json:"topping_id"`
	ToppingPrice      int      `gorm:"type:int;default:0;not null" json:"topping_price"`
	IsIncludedInCombo bool     `gorm:"type:boolean;default:false;not null" json:"is_included_in_combo"`

	// Associations
	OrderItem *OrderItem `gorm:"foreignKey:OrderItemID" json:"order_item,omitempty"`
	Topping   *Topping   `gorm:"foreignKey:ToppingID" json:"topping,omitempty"`
}

func (OrderItemTopping) TableName() string {
	return "order_item_topping"
}

// DTOs for Order creation & updates
type CreateOrderItemToppingRequest struct {
	ToppingID         uint `json:"topping_id" binding:"required"`
	ToppingPrice      int  `json:"topping_price"`
	IsIncludedInCombo bool `json:"is_included_in_combo"`
}

type CreateOrderItemRequest struct {
	ProductID      uint                            `json:"product_id" binding:"required"`
	Temperature    string                          `json:"temperature" binding:"required,oneof=iced hot"`
	SweetnessLevel string                          `json:"sweetness_level" binding:"required"`
	UnitPrice      int                             `json:"unit_price" binding:"required,min=0"`
	Quantity       int                             `json:"quantity" binding:"required,min=1"`
	Note           *string                         `json:"note"`
	Toppings       []CreateOrderItemToppingRequest `json:"toppings"`
}

type CreateOrderRequest struct {
	Method              string                   `json:"method" binding:"required,oneof=walk-in online nisit-shop"`
	EstimatedPickupTime *time.Time               `json:"estimated_pickup_time"`
	TotalAmount         int                      `json:"total_amount" binding:"required,min=0"`
	PaymentMethod       string                   `json:"payment_method" binding:"required,oneof=promptpay cash"`
	ReceivedAmount      *int                     `json:"received_amount"`
	SlipURL             *string                  `json:"slip_url"`
	Note                *string                  `json:"note"`
	Items               []CreateOrderItemRequest `json:"items" binding:"required,min=1"`
}

type UpdateOrderStatusRequest struct {
	OrderStatus string `json:"order_status" binding:"required,oneof=new_order preparing ready completed cancelled"`
}

type VerifyOrderSlipRequest struct {
	Status     *string `json:"status"`      // "verified", "pending", "fraud"
	IsVerified *bool   `json:"is_verified"` // backward compatibility: true = verified, false = pending/rejected
	Note       *string `json:"note"`
	CheckNote  *string `json:"check_note"` // หมายเหตุการตรวจสอบสลิป
}

type UpdateOrderRequest struct {
	EstimatedPickupTime *time.Time `json:"estimated_pickup_time"`
	TotalAmount         *int       `json:"total_amount"`
	PaymentMethod       *string    `json:"payment_method"`
	ReceivedAmount      *int       `json:"received_amount"`
	SlipURL             *string    `json:"slip_url"`
	OrderStatus         *string    `json:"order_status"`
	Note                *string    `json:"note"`
}
