package model;

import java.time.LocalDate;

/**
 * Represents a blood request made by a recipient.
 * Member 1 – Backend & OOP Architect
 */
public class BloodRequest {
    private static int idCounter = 1;

    public enum Status { PENDING, FULFILLED, REJECTED }

    private int id;
    private String recipientName;
    private String bloodGroup;
    private int unitsNeeded;
    private String reason;
    private LocalDate requestDate;
    private Status status;

    public BloodRequest(String recipientName, String bloodGroup, int unitsNeeded, String reason) {
        this.id = idCounter++;
        this.recipientName = recipientName;
        this.bloodGroup = bloodGroup;
        this.unitsNeeded = unitsNeeded;
        this.reason = reason;
        this.requestDate = LocalDate.now();
        this.status = Status.PENDING;
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    public int getId()                { return id; }
    public String getRecipientName()  { return recipientName; }
    public String getBloodGroup()     { return bloodGroup; }
    public int getUnitsNeeded()       { return unitsNeeded; }
    public String getReason()         { return reason; }
    public LocalDate getRequestDate() { return requestDate; }
    public Status getStatus()         { return status; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setStatus(Status status) { this.status = status; }

    /** Serialise to JSON. */
    public String toJson() {
        return String.format(
            "{\"id\":%d,\"recipientName\":\"%s\",\"bloodGroup\":\"%s\",\"unitsNeeded\":%d," +
            "\"reason\":\"%s\",\"requestDate\":\"%s\",\"status\":\"%s\"}",
            id, recipientName, bloodGroup, unitsNeeded, reason, requestDate, status
        );
    }
}
