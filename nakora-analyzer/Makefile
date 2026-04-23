.PHONY: build run test lint clean

BINARY=nakora-analyzer
CMD=./cmd/server

build:
	go build -o $(BINARY) $(CMD)

run:
	go run $(CMD)

test:
	go test ./...

lint:
	go vet ./...

clean:
	rm -f $(BINARY)
