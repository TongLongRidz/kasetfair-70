package model

import (
	"time"
)

type CashTransaction struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Type      string    `gorm:"type:varchar(20);not null;index" json:"type"` // "income" or "expense"
	Title     string    `gorm:"type:varchar(200);not null" json:"title"`
	Category  string    `gorm:"type:varchar(100);not null" json:"category"`
	Amount    float64   `gorm:"type:numeric(12,2);not null" json:"amount"`
	DateTime  time.Time `gorm:"not null;index" json:"date_time"`
	OrderID   *uint     `gorm:"index" json:"order_id"`
	OrderNo   string    `gorm:"type:varchar(50)" json:"order_no"`
	CreatedBy *uint     `gorm:"index" json:"created_by"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	Note      string    `gorm:"type:text" json:"note"`
}

func (CashTransaction) TableName() string {
	return "cash_transaction"
}
