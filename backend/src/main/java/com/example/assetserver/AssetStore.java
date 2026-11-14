package com.example.assetserver;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** In-memory storage reused from the earlier Spring project. */
@Repository
public class AssetStore {
    private final Map<Long, Asset> assets = new LinkedHashMap<>();
    private long nextId = 1;

    public AssetStore() {
        add("Dell Lab PC 1", "Available");
        add("HP Library PC 2", "In Use");
        add("Lenovo Faculty Laptop", "Available");
        add("Library Loan Laptop", "In Use");
        add("Engineering Lab Workstation", "Available");
        add("IT Help Desk Laptop", "Available");
    }

    public synchronized List<Asset> all() {
        return List.copyOf(assets.values());
    }

    public synchronized Optional<Asset> find(long id) {
        return Optional.ofNullable(assets.get(id));
    }

    public synchronized Asset add(String name, String status) {
        Asset asset = new Asset(nextId++, name, status);
        assets.put(asset.getId(), asset);
        return asset;
    }

    public synchronized Optional<Asset> update(long id, String name, String status) {
        if (!assets.containsKey(id)) return Optional.empty();
        Asset asset = new Asset(id, name, status);
        assets.put(id, asset);
        return Optional.of(asset);
    }

    public synchronized boolean delete(long id) {
        return assets.remove(id) != null;
    }
}
