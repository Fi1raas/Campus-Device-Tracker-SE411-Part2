package com.example.assetserver;

import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/assets")
public class AssetController {
    private final AssetService service;

    public AssetController(AssetService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Asset> add(@RequestBody AssetService.AssetInput input) {
        Asset asset = service.create(input);
        return ResponseEntity.created(URI.create("/assets/" + asset.getId())).body(asset);
    }

    @GetMapping("/{id}")
    public Asset find(@PathVariable long id) {
        return service.find(id);
    }

    @GetMapping
    public AssetService.AssetPage list(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "3") int size,
                                       @RequestParam(defaultValue = "") String q) {
        return service.list(page, size, q);
    }

    @PutMapping("/{id}")
    public Asset update(@PathVariable long id, @RequestBody AssetService.AssetInput input) {
        return service.update(id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
