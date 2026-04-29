# Security Specification for VCAY Beach House

## Data Invariants
1. A booking must be associated with the authenticated user's UID.
2. Only admins can modify pricing settings.
3. Users can only read and create their own bookings.
4. Users cannot change their own role.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (Booking)**: User A tries to create a booking with User B's `userId`.
   - Result: PERMISSION_DENIED
2. **Identity Spoofing (User Profile)**: User A tries to update User B's profile.
   - Result: PERMISSION_DENIED
3. **Privilege Escalation**: User A tries to set their own `role` to 'admin'.
   - Result: PERMISSION_DENIED
4. **Global Price Tampering**: Non-admin tries to update `/settings/prices`.
   - Result: PERMISSION_DENIED
5. **Shadow Update (Booking)**: User tries to add an `isAdmin: true` field to a booking document.
   - Result: PERMISSION_DENIED
6. **Integrity Violation (Booking Status)**: User tries to set a booking status directly to 'Cancelled' on creation (if we wanted to restrict that).
7. **Resource Poisoning (ID)**: Injecting a 2KB string as a booking ID.
   - Result: PERMISSION_DENIED
8. **Resource Poisoning (Field)**: Injecting a 1MB string into the `customer` field.
   - Result: PERMISSION_DENIED
9. **Orphaned Write**: Creating a booking without a `userId`.
   - Result: PERMISSION_DENIED
10. **Time Spoofing**: User tries to set `createdAt` to a future date instead of `request.time`.
    - Result: PERMISSION_DENIED
11. **PII Leak**: Authenticated User A tries to 'get' User B's profile.
    - Result: PERMISSION_DENIED
12. **Blanket List Attack**: User A tries to list all bookings without a `where` clause.
    - Result: PERMISSION_DENIED (if enforced correctly by rules)

## Test Runner (firestore.rules.test.ts)
(To be implemented if environment supports it, but I'll focus on the rules first)
