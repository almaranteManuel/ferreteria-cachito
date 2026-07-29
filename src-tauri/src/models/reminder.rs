use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Reminder {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub is_completed: bool,
    pub due_date: Option<String>,
    pub created_at: String,
}