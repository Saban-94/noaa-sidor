# Security Specification - SabanOS

## Data Invariants
1. An **Order** must have a valid `date`, `time`, `driverId`, `customerName`, `destination`, `items`, `warehouse`, and `status`. It must also track `createdBy`, `createdAt`, and `updatedAt`.
2. A **Driver** must have a `name`, `phone`, and `vehicleType`.
3. A **Customer** must have a `name` and `customerNumber`.
4. A **Reminder** must belong to a `userId` and have a `title`, `dueDate`, and `dueTime`.
5. **PII Isolation**: Customer phone numbers and driver phone numbers are sensitive. Access should be restricted to authenticated users.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create an order with `createdBy` matching another user's UID.
2. **Resource Poisoning**: Create an order with an extremely long `customerName` (> 1000 chars) to exploit storage costs.
3. **ID Injection**: Create an order with a document ID containing malicious scripts or paths.
4. **Illegal Status Jump**: Update an order status directly from `pending` to `delivered` bypassing `preparing` and `ready` (if business logic forbade it, though here it might be more about restricted fields).
5. **Unauthorized Field Update**: As a non-owner, attempt to update the `items` in an order.
6. **Orphaned Write**: Create a reminder without a `userId`.
7. **Time Spoofing**: Create an order with a `createdAt` timestamp from the past.
8. **Privilege Escalation**: Attempt to update a user document to grant admin privileges (if an admin field existed on the user document).
9. **Bulk Scraping**: Perform a broad query on all orders without any filters to leak data.
10. **Shadow Field Injection**: Add a `hiddenAdminOnlyField: true` to an order document.
11. **Negative Inventory**: Update inventory current stock to a negative number.
12. **Double Delete**: Attempt to delete another user's reminder.

## Test Runner (firestore.rules.test.ts)
(To be implemented if testing environment is available, but for now I will focus on the rules logic).
