package model;

import java.util.HashMap;
import java.util.Map;

/**
 * Tracks available blood units per blood group.
 * Member 1 – Backend & OOP Architect
 */
public class BloodStock {

    /** All valid blood groups supported by the system. */
    public static final String[] BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};

    /** Low-stock threshold (units). A warning is raised below this value. */
    public static final int LOW_STOCK_THRESHOLD = 5;

    private Map<String, Integer> stock;

    public BloodStock() {
        stock = new HashMap<>();
        // Initialise with seed data so the dashboard is not empty on first load
        stock.put("A+",  12);
        stock.put("A-",   4);
        stock.put("B+",   9);
        stock.put("B-",   3);
        stock.put("AB+",  6);
        stock.put("AB-",  2);
        stock.put("O+",  15);
        stock.put("O-",   5);
    }

    /**
     * Returns current units for a blood group, or 0 if not found.
     */
    public int getUnits(String bloodGroup) {
        return stock.getOrDefault(bloodGroup, 0);
    }

    /**
     * Adds units to a blood group (donation).
     */
    public void addUnits(String bloodGroup, int units) {
        stock.merge(bloodGroup, units, Integer::sum);
    }

    /**
     * Removes units from a blood group (fulfilment of a request).
     * @return true if stock was sufficient, false otherwise.
     */
    public boolean removeUnits(String bloodGroup, int units) {
        int current = stock.getOrDefault(bloodGroup, 0);
        if (current < units) return false;
        stock.put(bloodGroup, current - units);
        return true;
    }

    /**
     * Returns true if a blood group is below the low-stock threshold.
     */
    public boolean isLowStock(String bloodGroup) {
        return getUnits(bloodGroup) < LOW_STOCK_THRESHOLD;
    }

    /** Serialise entire stock map to JSON. */
    public String toJson() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < BLOOD_GROUPS.length; i++) {
            String bg = BLOOD_GROUPS[i];
            int units = getUnits(bg);
            sb.append(String.format(
                "{\"bloodGroup\":\"%s\",\"units\":%d,\"lowStock\":%b}",
                bg, units, isLowStock(bg)
            ));
            if (i < BLOOD_GROUPS.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
