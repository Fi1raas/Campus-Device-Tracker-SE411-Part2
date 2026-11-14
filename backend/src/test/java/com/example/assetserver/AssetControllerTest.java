package com.example.assetserver;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AssetControllerTest {
    private AssetService service;
    private MockMvc mvc;
    private final Asset demo = new Asset(7L, "Demo Laptop", "In Use");
    private final AssetService.AssetInput input = new AssetService.AssetInput("Demo Laptop", "In Use");
    private final String json = "{\"name\":\"Demo Laptop\",\"status\":\"In Use\"}";

    @BeforeEach void setup() {
        service = mock(AssetService.class);
        mvc = MockMvcBuilders.standaloneSetup(new AssetController(service)).build();
    }

    @Test void postReturns201AndLocation() throws Exception {
        when(service.create(input)).thenReturn(demo);
        mvc.perform(post("/assets").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isCreated()).andExpect(header().string("Location", "/assets/7"))
            .andExpect(jsonPath("$.id").value(7));
    }

    @Test void getByIdReturnsAsset() throws Exception {
        when(service.find(7L)).thenReturn(demo);
        mvc.perform(get("/assets/7")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Demo Laptop"));
    }

    @Test void paginatedListExposesPageMetadataAndSearch() throws Exception {
        when(service.list(1, 3, "Demo")).thenReturn(new AssetService.AssetPage(List.of(demo), 1, 3, 2, 4, 7, 4, 3));
        mvc.perform(get("/assets").param("page", "1").param("size", "3").param("q", "Demo"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value(7))
            .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test void putAndDeleteUsePathId() throws Exception {
        when(service.update(7L, input)).thenReturn(demo);
        mvc.perform(put("/assets/7").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(7));
        mvc.perform(delete("/assets/7")).andExpect(status().isNoContent());
        verify(service).delete(7L);
    }
}
