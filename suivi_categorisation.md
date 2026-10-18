# Suivi de la Catégorisation Sémantique CinéScope (Deux Listes)

> Ce document assure la traçabilité permanente entre les œuvres validées formellement par le **Binôme (Utilisateur + Antigravity)** et les nouvelles œuvres catégorisées automatiquement par **DeepSeek** lors des synchronisations quotidiennes.

**Date de dernière mise à jour :** 18/10/2026 17:00:16

## 📊 Vue d'Ensemble

| Liste | Nombre d'œuvres | Statut | Règle de Gouvernance |
| :--- | :---: | :---: | :--- |
| 🟢 **Validé par le binôme** (`valide_binome`) | **1414** | 🔒 Certifié & Sanctuarisé | Aucune modification sans accord explicite. Contresens protégés. |
| 🟡 **Validé uniquement par DeepSeek** (`auto_deepseek`) | **0** | ⏳ En attente de revue | Nouveaux ajouts automatiques JustWatch à auditer par le binôme. |
| **TOTAL CATALOGUE** | **1414** | ✅ Conforme (1 œuvre = 1 cat) | Fenêtre glissante 20 ans (≥ 2006). |

## 🟡 Nouveautés DeepSeek en Attente de Revue (0)

*Toutes les œuvres du catalogue font actuellement partie de la liste certifiée par le binôme ! Aucune nouvelle œuvre en attente d'arbitrage.* 🎉

## 🛠️ Commandes Utiles pour l'Arbitrage

```bash
# 1. Consulter les nouveautés DeepSeek et les alertes de contresens :
node scripts/audit_nouveautes.cjs

# 2. Valider d'un coup toutes les nouveautés après examen du binôme :
node scripts/audit_nouveautes.cjs --validate-all

# 3. Corriger un contresens repéré sur une œuvre et la valider :
node scripts/audit_nouveautes.cjs --set <ID_OEUVRE> <NOUVELLE_CATEGORIE>
# Exemple : node scripts/audit_nouveautes.cjs --set jw-tm123456 comedie
```
