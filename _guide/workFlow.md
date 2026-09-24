Visiteur
   │
   ▼
Demande d'intégration
/prénom
/nom
/email
/nom organisation
/objectif organisation
   │
   ▼
PENDING
   │
   ▼
Administration IKBS
Liste des demandes
   │
   ├── Rejeter
   │
   └── Valider
          │
          ├── Création Organisation
          │
          ├── Création du premier Membre
          │
          ├── Attribution rôle ORG_ADMIN
          │
          ├── Création des accès
          │
          └── Envoi email
                 │
                 ▼
          Premier administrateur
                 │
                 ▼
          /espace/{organizationCode}
                 │
       ┌─────────┼──────────┐
       ▼         ▼          ▼
    Membres  Cotisations  Événements
       │
       ├── Commissions
       ├── Rôles
       └── Paramètres

Et c'est le backend qui orchestre :

validateRequest()
    ↓
createOrganization()
    ↓
createFirstMember()
    ↓
assignOrganizationAdminRole()
    ↓
createInitialAccess()
    ↓
markRequestApproved()
    ↓
sendWelcomeNotification()