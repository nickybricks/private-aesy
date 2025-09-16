# Admin System Setup Guide

## Übersicht

Das Admin-System ermöglicht es Administratoren:
- Alle Kundendaten zu sehen
- Kundenkonten zu verwalten  
- Sich als Kunde anzumelden (Impersonation)
- Rollen zu verwalten

## Ersten Admin erstellen

Da noch keine Admins existieren, muss der erste Admin manuell erstellt werden:

### Option 1: Über Browser-Konsole (Empfohlen)
1. Öffne die Anwendung im Browser
2. Drücke F12 für Developer Tools
3. Gehe zum "Console" Tab
4. Führe folgenden Befehl aus:
```javascript
await makeUserAdmin('ihre-email@domain.com')
```

### Option 2: Direkt in der Datenbank
1. Gehe zum Supabase Dashboard
2. Öffne den SQL Editor
3. Führe folgenden SQL-Befehl aus:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.user_role
FROM auth.users 
WHERE email = 'ihre-email@domain.com';
```

## Funktionen

### Admin Dashboard (`/admin`)
- Übersicht aller Benutzer
- Benutzerstatistiken
- Rollenverwaltung
- Impersonation-Funktionen

### Impersonation
1. Im Admin Dashboard auf "Anmelden als" bei einem Kunden klicken
2. Sie sehen jetzt die Daten des Kunden
3. Orange Banner zeigt aktuelle Impersonation an
4. "Beenden" klicken, um zur normalen Ansicht zurückzukehren

### Rollen
- **customer**: Normale Benutzer (Standard)
- **admin**: Kann Kunden verwalten und Impersonation nutzen
- **super_admin**: Kann auch andere Admins ernennen

## Security Features

- **Row Level Security (RLS)**: Alle Daten sind durch Policies geschützt
- **Audit Logs**: Alle Admin-Aktionen werden protokolliert
- **Role Hierarchy**: Super Admins können Admins verwalten
- **Impersonation Tracking**: Jede Impersonation wird geloggt

## Häufige Probleme

### "Zugriff verweigert" Fehlermeldung
- Rolle wurde noch nicht zugewiesen
- Browser-Cache leeren und neu anmelden

### Admin-Menü nicht sichtbar
- Rolle-Cache aktualisieren: Seite neu laden
- Überprüfen ob Rolle korrekt in Datenbank gesetzt ist

### Impersonation funktioniert nicht
- Sicherstellen, dass Admin-Rolle vorhanden ist
- Session Storage leeren falls nötig

## Datenbank-Tabellen

### `user_roles`
- Speichert Benutzerrollen
- Eindeutige Zuordnung user_id -> role

### `audit_logs`
- Protokolliert alle Admin-Aktionen
- Enthält alte und neue Werte bei Änderungen

## Support

Bei Problemen prüfen Sie:
1. Supabase Logs auf Fehler
2. Browser-Konsole auf JavaScript-Fehler
3. RLS Policies in der Datenbank