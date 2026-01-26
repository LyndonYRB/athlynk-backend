# FitFriends Backend — Frontend Integration Guide

This repo contains the backend API for the FitFriends React UI.

## What this backend provides (working)
Auth (JWT)  
Profile create/update + fetch  
Photo upload + serving static images  
Explore feed (basic: other users’ cards)

---

# 1. Local Setup (Frontend dev instructions)

## Requirements
- Node.js (LTS recommended)
- Docker Desktop

## Run Postgres (Docker)
From backend repo root:
```bash
docker compose up -d
docker ps
