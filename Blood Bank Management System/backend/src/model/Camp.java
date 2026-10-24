package model;

import java.time.LocalDate;

/**
 * Represents a blood donation camp / event scheduled by the system.
 * Tracks camp details including venue, organizer, and current status.
 */
public class Camp {
    private static int idCounter = 1;

    public enum Status { UPCOMING, COMPLETED, CANCELLED }

    private int id;
    private String name;
    private String venue;
    private LocalDate date;
    private String organizer;
    private Status status;

    public Camp(String name, String venue, LocalDate date, String organizer, Status status) {
        this.id = idCounter++;
        this.name = name;
        this.venue = venue;
        this.date = date;
        this.organizer = organizer;
        this.status = status;
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    public int getId()            { return id; }
    public String getName()       { return name; }
    public String getVenue()      { return venue; }
    public LocalDate getDate()    { return date; }
    public String getOrganizer()  { return organizer; }
    public Status getStatus()     { return status; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setStatus(Status status) { this.status = status; }

    /** Serialise to a simple JSON string (no external library needed). */
    public String toJson() {
        return String.format(
            "{\"id\":%d,\"name\":\"%s\",\"venue\":\"%s\",\"date\":\"%s\",\"organizer\":\"%s\",\"status\":\"%s\"}",
            id, name, venue, date, organizer, status
        );
    }
}
