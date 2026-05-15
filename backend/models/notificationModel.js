const { poolPromise, sql } = require('../config/db');

async function createNotification({ userId, title, message, type, relatedId, relatedType }) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('Title', sql.NVarChar, title)
      .input('Message', sql.NVarChar, message)
      .input('Type', sql.NVarChar, type)
      .input('RelatedID', sql.Int, relatedId || null)
      .input('RelatedType', sql.NVarChar, relatedType || null)
      .query(`
        INSERT INTO Notifications (UserID, Title, Message, Type, RelatedID, RelatedType, CreatedAt, IsRead)
        VALUES (@UserID, @Title, @Message, @Type, @RelatedID, @RelatedType, GETDATE(), 0)
      `);
  } catch (err) {
    console.warn('Failed to create notification:', err.message);
    // Don't throw - notifications are optional
  }
}

async function getNotifications(userId, limit = 20) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .input('Limit', sql.Int, limit)
    .query(`
      SELECT NotificationID, Title, Message, Type, IsRead, CreatedAt, RelatedID, RelatedType
      FROM Notifications
      WHERE UserID = @UserID
      ORDER BY CreatedAt DESC
      OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY
    `);
  return result.recordset;
}

async function markNotificationRead(notificationId, userId) {
  const pool = await poolPromise;
  await pool.request()
    .input('NotificationID', sql.Int, notificationId)
    .input('UserID', sql.Int, userId)
    .query(`
      UPDATE Notifications 
      SET IsRead = 1, ReadAt = GETDATE()
      WHERE NotificationID = @NotificationID AND UserID = @UserID
    `);
}

async function getUnreadCount(userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .query(`SELECT COUNT(*) as count FROM Notifications WHERE UserID = @UserID AND IsRead = 0`);
  return result.recordset[0].count;
}

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  getUnreadCount,
};