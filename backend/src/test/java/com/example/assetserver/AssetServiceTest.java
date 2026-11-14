package com.example.assetserver;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssetServiceTest {
    private AssetStore store;
    private AssetService service;
    private final AssetService.AssetInput input = new AssetService.AssetInput("  Lab PC  ", "Available");

    @BeforeEach void setup() {
        store = mock(AssetStore.class);
        service = new AssetService(store);
    }

    @Test void createTrimsNameAndUsesStoreId() {
        when(store.add("Lab PC", "Available")).thenReturn(new Asset(8L, "Lab PC", "Available"));
        assertEquals(8L, service.create(input).getId());
        verify(store).add("Lab PC", "Available");
    }

    @Test void invalidInputDoesNotWrite() {
        assertStatus(400, () -> service.create(new AssetService.AssetInput(" ", "Available")));
        assertStatus(400, () -> service.update(1L, new AssetService.AssetInput("PC", "Broken")));
        verifyNoInteractions(store);
    }

    @Test void lookUpByIdAndReportMissingDevice() {
        Asset item = new Asset(4L, "Laptop", "Available");
        when(store.find(4L)).thenReturn(Optional.of(item));
        assertSame(item, service.find(4L));
        assertStatus(404, () -> service.find(99L));
    }

    @Test void pageResultsAfterCaseInsensitiveFiltering() {
        when(store.all()).thenReturn(List.of(new Asset(1L, "Lab PC 1", "Available"),
            new Asset(2L, "Library Laptop", "In Use"), new Asset(3L, "Lab PC 3", "In Use")));
        var page = service.list(1, 1, "LAB PC");
        assertEquals(List.of(3L), page.items().stream().map(Asset::getId).toList());
        assertEquals(2, page.totalPages());
        assertEquals(2, page.totalElements());
        assertEquals(3, page.inventoryTotal());
        assertEquals(1, page.available());
        assertEquals(2, page.inUse());
        assertTrue(service.list(Integer.MAX_VALUE, 100, "").items().isEmpty());
    }

    @Test void rejectInvalidPagination() {
        assertStatus(400, () -> service.list(-1, 3, ""));
        assertStatus(400, () -> service.list(0, 0, ""));
        assertStatus(400, () -> service.list(0, 101, ""));
        verifyNoInteractions(store);
    }

    @Test void updateKeepsIdAndReportsMissingDevice() {
        when(store.update(5L, "Lab PC", "Available")).thenReturn(Optional.of(new Asset(5L, "Lab PC", "Available")));
        assertEquals(5L, service.update(5L, input).getId());
        assertStatus(404, () -> service.update(99L, input));
    }

    @Test void deleteChecksWhetherDeviceExists() {
        when(store.delete(1L)).thenReturn(true);
        assertDoesNotThrow(() -> service.delete(1L));
        assertStatus(404, () -> service.delete(42L));
    }

    private void assertStatus(int expected, org.junit.jupiter.api.function.Executable action) {
        assertEquals(expected, assertThrows(ResponseStatusException.class, action).getStatusCode().value());
    }
}
