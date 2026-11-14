package com.example.assetserver;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AssetStoreTest {
    @Test void storesUpdatesAndDeletesDevicesWithoutReusingIds() {
        AssetStore store = new AssetStore();
        int originalSize = store.all().size();
        Asset added = store.add("New laptop", "Available");
        assertEquals(originalSize + 1, store.all().size());
        assertEquals("New laptop", store.find(added.getId()).orElseThrow().getName());
        assertEquals("In Use", store.update(added.getId(), "New laptop", "In Use").orElseThrow().getStatus());
        assertTrue(store.delete(added.getId()));
        assertTrue(store.find(added.getId()).isEmpty());
        assertTrue(store.update(added.getId(), "Missing", "In Use").isEmpty());
        assertFalse(store.delete(added.getId()));
        assertTrue(store.add("Another laptop", "Available").getId() > added.getId());
    }
}
