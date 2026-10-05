package model

import (
	"time"
)

type Debt struct {
	ID                uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	CashTransactionID *uint            `gorm:"index" json:"cash_transaction_id"`
	CashTransaction   *CashTransaction `gorm:"foreignKey:CashTransactionID;constraint:OnDelete:CASCADE" json:"cash_transaction,omitempty"`
	StaffID           uint             `gorm:"not null;index" json:"staff_id"` // ใครออกก่อน
	Staff             *Staff           `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	PaidByStaffID     *uint            `gorm:"index" json:"paid_by_staff_id"` // ใครจ่ายเงินคืน
	PaidByStaff       *Staff           `gorm:"foreignKey:PaidByStaffID" json:"paid_by_staff,omitempty"`
	Amount            float64          `gorm:"type:numeric(12,2);not null" json:"amount"`
	IsPaid            bool             `gorm:"default:false;not null;index" json:"is_paid"`
	PaidAt            *time.Time       `json:"paid_at"`
	Note              string           `gorm:"type:text" json:"note"`
	CreatedAt         time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time        `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Debt) TableName() string {
	return "debt"
}
