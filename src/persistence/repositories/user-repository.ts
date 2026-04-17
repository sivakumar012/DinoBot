/**
 * Stored representation of a User record from the database.
 */
export interface StoredUser {
  id: string;
  created_at: string;
}

/**
 * Repository interface for User persistence operations.
 * Requirements: 2.1
 */
export interface UserRepository {
  create(): Promise<StoredUser>;
  findById(id: string): Promise<StoredUser | null>;
}
