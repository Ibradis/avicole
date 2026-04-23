# Avicole ERP — Gestion Avicole Multi-Entités (SaaS)

Avicole ERP est une solution SaaS complète conçue pour automatiser et unifier la gestion des exploitations avicoles et de leurs points de vente (boutiques). Elle permet une traçabilité totale, de la production en ferme jusqu'à la vente finale, avec une gestion financière rigoureuse et sécurisée.

## 🚀 Architecture Technique

Le projet repose sur une architecture moderne et conteneurisée :

- **Backend** : Django REST Framework (Python 3.11)
- **Frontend** : Next.js 14+ (App Router, Tailwind CSS, Shadcn/UI)
- **Base de données** : PostgreSQL
- **Moteur de tâches** : Celery & Redis (pour les side-effects et calculs asynchrones)
- **Serveur Web** : Nginx (Reverse Proxy)
- **Conteneurisation** : Docker & Docker Compose

## ✨ Fonctionnalités Clés

### 🏗️ Structure Multi-Entités
- **Isolation SaaS** : Chaque organisation dispose de ses propres données cloisonnées.
- **Fermes & Boutiques** : Gestion distincte mais synchronisée des stocks et des finances entre la production et la distribution.

### 🐓 Gestion de Production (Ferme)
- Suivi des **Lots** (souche, âge, effectifs).
- Enregistrement quotidien des **Productions** (œufs, cassés) et des **Mortalités**.
- Suivi de l'**Alimentation** et de la **Santé** (vaccinations, traitements).

### 📦 Stocks & Ventes
- **Mouvements de stock** automatiques lors des ventes et achats.
- **Réapprovisionnements Miroirs** : Une vente de la ferme vers une boutique génère automatiquement un achat brouillon côté boutique.
- Alertes de seuil critique par entité.

### 💳 Finances & Trésorerie
- **Multi-Portefeuilles** : Gestion des caisses et comptes bancaires par boutique/ferme.
- **Flux de Paiement Interne Sécurisé** : Système de validation en deux étapes pour les transferts de fonds internes (Initiation par le gérant $\rightarrow$ Validation par le PDG).
- Suivi des soldes partenaires (Clients/Fournisseurs).

### 📊 Reporting & Exports
- Tableaux de bord dynamiques par rôle.
- Génération de PDF et Excel pour les factures, bons de livraison et rapports de stock.

## 🛠️ Installation & Démarrage

### Prérequis
- Docker & Docker Compose installé.

### Lancement
1. Clonez le dépôt.
2. Configurez les variables d'environnement dans un fichier `.env`.
3. Lancez l'infrastructure complète :
   ```bash
   docker compose up --build
   ```

### Accès
- **Frontend** : `http://localhost:13000`
- **API (Swagger)** : `http://localhost:8000/api/schema/swagger-ui/`
- **Admin Django** : `http://localhost:8000/admin/`

## 🔒 Sécurité & Rôles (RBAC)
- **PDG** : Visibilité totale sur l'organisation, validation financière.
- **Gérant de Ferme** : Gestion opérationnelle de la production et des stocks ferme.
- **Gérant de Boutique** : Gestion des ventes et réapprovisionnements de sa boutique.
- **Vendeur** : Droits restreints aux opérations de caisse et de vente.

---
*Développé pour une gestion avicole moderne, efficace et transparente.*
