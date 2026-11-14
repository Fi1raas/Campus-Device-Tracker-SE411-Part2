package com.example.assetserver;

import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssetService {
    private final AssetStore store;

    public AssetService(AssetStore store) {
        this.store = store;
    }

    public record AssetInput(String name, String status) {}
    public record AssetPage(List<Asset> items, int page, int size, int totalPages,
                            int totalElements, int inventoryTotal, long available, long inUse) {}

    public Asset create(AssetInput input) {
        validate(input);
        return store.add(input.name().strip(), input.status());
    }

    public Asset find(long id) {
        return store.find(id).orElseThrow(AssetService::notFound);
    }

    public AssetPage list(int page, int size, String query) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Page must be non-negative and size must be between 1 and 100.");
        }
        List<Asset> all = store.all();
        String term = query.strip().toLowerCase(Locale.ROOT);
        List<Asset> matches = all.stream()
            .filter(a -> a.getName().toLowerCase(Locale.ROOT).contains(term)
                      || a.getStatus().toLowerCase(Locale.ROOT).contains(term))
            .toList();
        int from = (int) Math.min((long) page * size, matches.size());
        int to = Math.min(from + size, matches.size());
        long available = all.stream().filter(a -> "Available".equals(a.getStatus())).count();
        return new AssetPage(matches.subList(from, to), page, size,
            (int) Math.ceil((double) matches.size() / size), matches.size(),
            all.size(), available, all.size() - available);
    }

    public Asset update(long id, AssetInput input) {
        validate(input);
        return store.update(id, input.name().strip(), input.status())
            .orElseThrow(AssetService::notFound);
    }

    public void delete(long id) {
        if (!store.delete(id)) throw notFound();
    }

    private static void validate(AssetInput input) {
        if (input == null || input.name() == null || input.name().strip().isEmpty()
                || input.name().strip().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a device name of 1 to 100 characters.");
        }
        if (!"Available".equals(input.status()) && !"In Use".equals(input.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be Available or In Use.");
        }
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found.");
    }
}
