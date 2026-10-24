package model;

import java.time.LocalDate;

/**
 * Represents a blood donor registered in the system.
 * Member 1 – Backend & OOP Architect
 */
public class Donor {
    private static int idCounter = 1;

    private int id;
    private String name;
    private int age;
    private String bloodGroup;
    private String phone;
    private LocalDate lastDonationDate; // null if never donated

    public Donor(String name, int age, String bloodGroup, String phone, LocalDate lastDonationDate) {
        this.id = idCounter++;
        this.name = name;
        this.age = age;
        this.bloodGroup = bloodGroup;
        this.phone = phone;
        this.lastDonationDate = lastDonationDate;
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    public int getId()                  { return id; }
    public String getName()             { return name; }
    public int getAge()                 { return age; }
    public String getBloodGroup()       { return bloodGroup; }
    public String getPhone()            { return phone; }
    public LocalDate getLastDonationDate() { return lastDonationDate; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setLastDonationDate(LocalDate date) { this.lastDonationDate = date; }

    /** Serialise to a simple JSON string (no external library needed). */
    public String toJson() {
        String dateStr = (lastDonationDate != null) ? "\"" + lastDonationDate + "\"" : "null";
        return String.format(
            "{\"id\":%d,\"name\":\"%s\",\"age\":%d,\"bloodGroup\":\"%s\",\"phone\":\"%s\",\"lastDonationDate\":%s}",
            id, name, age, bloodGroup, phone, dateStr
        );
    }

    @Override
    public String toString() {
        return "Donor[id=" + id + ", name=" + name + ", bloodGroup=" + bloodGroup + "]";
    }
}
