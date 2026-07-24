package main

import (
	"log"

	"sacc.com/server/internal/app"
)

func main() {
	if err := app.Run(); err != nil {
		log.Fatalf("api server exited with error: %v", err)
	}
}
