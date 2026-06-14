# Стандарт импорта расписания «Цифровой ВУЗ»

Версия формата: **1.0**

## JSON (рекомендуется)

Файл UTF-8, расширение `.json`.

```json
{
  "formatVersion": "1.0",
  "organizationSlug": "sstu",
  "studyGroup": "м2-ИФСТ-11",
  "studyGroupExternalKey": "55",
  "generatedAt": "2026-06-01T12:00:00+04:00",
  "entries": [
    {
      "date": "2026-06-02",
      "timeStart": "09:00",
      "timeEnd": "10:30",
      "subject": "Математика",
      "room": "ауд. 301",
      "kind": "лекция",
      "teacher": "Иванов И.И."
    }
  ]
}
```

### Поля

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `formatVersion` | да | `"1.0"` |
| `organizationSlug` | да | slug вуза |
| `studyGroup` | да | название группы |
| `studyGroupExternalKey` | нет | внешний ID (для синхронизации) |
| `generatedAt` | нет | ISO 8601 |
| `entries` | да | массив занятий |
| `entries[].date` | да | `YYYY-MM-DD` |
| `entries[].timeStart` | да | `HH:MM` |
| `entries[].timeEnd` | да | `HH:MM` |
| `entries[].subject` | да | дисциплина |
| `entries[].room` | нет | аудитория |
| `entries[].kind` | нет | лекция / практика / … |
| `entries[].teacher` | нет | ФИО преподавателя |

Импорт: админ загружает файл в UI или кладёт в `tenants/{slug}/data/schedule/` и запускает `npm run tenant:import-schedule`.

---

## Legacy TXT (обратная совместимость)

Формат из архива СГТУ (`date=weekday=lessons`, блоки по дням). Парсится сервисом `services/sstu-parser` (`POST /parse/sstu-txt`).

Пример имени файла: `м2-ИФСТ-11.txt`

---

## Пакетная выгрузка (несколько групп)

ZIP с структурой:

```
schedule-export/
  manifest.json          # список групп
  groups/
    m2-ifst-11.json
    b-bist-11.json
```

`manifest.json`:

```json
{
  "formatVersion": "1.0",
  "organizationSlug": "sstu",
  "groups": ["м2-ИФСТ-11", "б-БИСТ-11"]
}
```
