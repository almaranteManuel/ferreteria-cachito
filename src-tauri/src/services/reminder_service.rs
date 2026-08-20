use crate::models::reminder::{
    CreateReminderDto, CreateSupplierDebtDto, ReminderWithSupplier,
};
use crate::repositories::reminder_repo::ReminderRepository;
use sqlx::SqlitePool;

pub struct ReminderService;

impl ReminderService {
    pub async fn list_all(pool: &SqlitePool) -> Result<Vec<ReminderWithSupplier>, String> {
        ReminderRepository::list_all(pool)
            .await
            .map_err(|e| format!("Error al listar recordatorios: {}", e))
    }

    pub async fn list_pending_supplier_debts(
        pool: &SqlitePool,
    ) -> Result<Vec<ReminderWithSupplier>, String> {
        ReminderRepository::list_pending_supplier_debts(pool)
            .await
            .map_err(|e| format!("Error al listar deudas: {}", e))
    }

    pub async fn create_supplier_debt(
        pool: &SqlitePool,
        dto: CreateSupplierDebtDto,
    ) -> Result<ReminderWithSupplier, String> {
        if dto.title.trim().is_empty() {
            return Err("El título es obligatorio".into());
        }
        if dto.amount <= 0.0 {
            return Err("El monto debe ser mayor a cero".into());
        }

        let id = ReminderRepository::create_supplier_debt(pool, &dto)
            .await
            .map_err(|e| format!("Error al registrar deuda: {}", e))?;

        let all = Self::list_all(pool).await?;
        all.into_iter()
            .find(|r| r.id == id)
            .ok_or_else(|| "Deuda creada pero no encontrada".into())
    }

    pub async fn create(pool: &SqlitePool, dto: CreateReminderDto) -> Result<ReminderWithSupplier, String> {
        if dto.title.trim().is_empty() {
            return Err("El título es obligatorio".into());
        }

        let id = ReminderRepository::create(pool, &dto)
            .await
            .map_err(|e| format!("Error al crear recordatorio: {}", e))?;

        let all = Self::list_all(pool).await?;
        all.into_iter()
            .find(|r| r.id == id)
            .ok_or_else(|| "Recordatorio creado pero no encontrado".into())
    }

    pub async fn mark_paid(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let updated = ReminderRepository::mark_completed(pool, id)
            .await
            .map_err(|e| format!("Error al marcar como pagada: {}", e))?;
        if !updated {
            return Err(format!("Deuda con ID {} no encontrada", id));
        }
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let deleted = ReminderRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar: {}", e))?;
        if !deleted {
            return Err(format!("Registro con ID {} no encontrado", id));
        }
        Ok(())
    }
}
