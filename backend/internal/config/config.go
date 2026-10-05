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
	// Load root .env file
	if err := godotenv.Load("../.env"); err != nil {
		if errCur := godotenv.Load(".env"); errCur != nil {
			log.Println("Note: .env file not found or could not be loaded, reading from environment")
		}
	}

	port := getEnv("BACKEND_PORT")
	if port == "" {
		port = getEnv("PORT")
	}

	return &Config{
		Port:          port,
		AppEnv:        getEnv("APP_ENV"),
		DBHost:        getEnv("DB_HOST"),
		DBPort:        getEnv("DB_PORT"),
		DBUser:        getEnv("DB_USER"),
		DBPassword:    getEnv("DB_PASSWORD"),
		DBName:        getEnv("DB_NAME"),
		DBSSLMode:     getEnv("DB_SSLMODE"),
		JWTSecret:     getEnv("JWT_SECRET"),
		RedisHost:     getEnv("REDIS_HOST"),
		RedisPort:     getEnv("REDIS_PORT"),
		RedisPassword: getEnv("REDIS_PASSWORD"),
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

func getEnv(key string) string {
	return os.Getenv(key)
}
