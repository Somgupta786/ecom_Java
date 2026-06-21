package com.ecommerce.lite.controller;

import com.ecommerce.lite.model.Category;
import com.ecommerce.lite.model.Product;
import com.ecommerce.lite.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Handle empty search parameter
        String searchStr = (search == null || search.trim().isEmpty()) ? null : search.trim();
        
        return ResponseEntity.ok(productService.searchProducts(categoryId, searchStr, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Product>> getRecommendations() {
        return ResponseEntity.ok(productService.getRecommendations());
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<Product>> getRelated(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getRelatedProducts(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(@RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(productService.getCategoriesBySearch(search));
        }
        return ResponseEntity.ok(productService.getAllCategories());
    }
}
