package model;

import java.time.LocalDate;

/**
 * Represents a historical donation record in the system.
 * Tracks each successful donation with donor details and date.
 */
public class DonationRecord {
    private static int idCounter = 1;

    private int id;
    private int donorId;
    private String donorName;
    private String bloodGroup;
    private int units;
    private LocalDate donationDate;

    public DonationRecord(int donorId, String donorName, String bloodGroup, int units, LocalDate donationDate) {
        this.id = idCounter++;
        this.donorId = donorId;
        this.donorName = donorName;
        this.bloodGroup = bloodGroup;
        this.units = units;
        this.donationDate = donationDate;
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    public int getId()               { return id; }
    public int getDonorId()          { return donorId; }
    public String getDonorName()     { return donorName; }
    public String getBloodGroup()    { return bloodGroup; }
    public int getUnits()            { return units; }
    public LocalDate getDonationDate() { return donationDate; }

    /** Serialise to a simple JSON string (no external library needed). */
    public String toJson() {
        return String.format(
            "{\"id\":%d,\"donorId\":%d,\"donorName\":\"%s\",\"bloodGroup\":\"%s\",\"units\":%d,\"donationDate\":\"%s\"}",
            id, donorId, donorName, bloodGroup, units, donationDate
        );
    }
}
