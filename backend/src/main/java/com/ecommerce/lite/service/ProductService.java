package com.ecommerce.lite.service;

import com.ecommerce.lite.model.Category;
import com.ecommerce.lite.model.Product;
import com.ecommerce.lite.model.Synonym;
import com.ecommerce.lite.repository.CategoryRepository;
import com.ecommerce.lite.repository.ProductRepository;
import com.ecommerce.lite.repository.SynonymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SynonymRepository synonymRepository;

    @Transactional(readOnly = true)
    public Page<Product> searchProducts(Long categoryId, String search, Pageable pageable) {
        if (search == null || search.trim().isEmpty()) {
            if (categoryId != null) {
                return productRepository.searchByCategory(categoryId, pageable);
            } else {
                return productRepository.findAll(pageable);
            }
        }

        String cleanSearch = search.trim().toLowerCase().replace("-", "").replace(" ", "");
        String searchPattern = "%" + cleanSearch + "%";
        String searchAltPattern = searchPattern;

        List<Synonym> synonyms = synonymRepository.findByTermOrSynonymIgnoreCase(cleanSearch);
        if (!synonyms.isEmpty()) {
            Synonym s = synonyms.get(0);
            String altWord = s.getTerm().equalsIgnoreCase(cleanSearch) ? s.getSynonym() : s.getTerm();
            searchAltPattern = "%" + altWord.trim().toLowerCase().replace("-", "").replace(" ", "") + "%";
        }

        if (categoryId != null) {
            return productRepository.searchByCategoryAndSearch(categoryId, searchPattern, searchAltPattern, pageable);
        } else {
            return productRepository.searchByText(searchPattern, searchAltPattern, pageable);
        }
    }

    @Cacheable(value = "products", key = "#id")
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    @Transactional
    public Product updateProduct(Long id, Product details) {
        Product existing = getProductById(id);
        existing.setName(details.getName());
        existing.setDescription(details.getDescription());
        existing.setPrice(details.getPrice());
        existing.setStock(details.getStock());
        existing.setImageUrl(details.getImageUrl());
        if (details.getCategory() != null) {
            existing.setCategory(details.getCategory());
        }
        return productRepository.save(existing);
    }

    @CacheEvict(value = "products", key = "#id")
    @Transactional
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Cacheable(value = "categories")
    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Category> getCategoriesBySearch(String search) {
        if (search == null || search.trim().isEmpty()) {
            return categoryRepository.findAll();
        }

        String cleanSearch = search.trim().toLowerCase().replace("-", "").replace(" ", "");
        String searchPattern = "%" + cleanSearch + "%";
        String searchAltPattern = searchPattern;

        List<Synonym> synonyms = synonymRepository.findByTermOrSynonymIgnoreCase(cleanSearch);
        if (!synonyms.isEmpty()) {
            Synonym s = synonyms.get(0);
            String altWord = s.getTerm().equalsIgnoreCase(cleanSearch) ? s.getSynonym() : s.getTerm();
            searchAltPattern = "%" + altWord.trim().toLowerCase().replace("-", "").replace(" ", "") + "%";
        }

        return productRepository.findCategoriesBySearchText(searchPattern, searchAltPattern);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public List<Product> getRecommendations() {
        // Simple personalization recommendation: top-rated products
        return productRepository.findTop5ByOrderByRatingDesc();
    }

    @Transactional(readOnly = true)
    public List<Product> getRelatedProducts(Long productId) {
        Product product = getProductById(productId);
        if (product.getCategory() != null) {
            return productRepository.findTop5ByCategoryIdAndIdNot(product.getCategory().getId(), productId);
        }
        return productRepository.findTop5ByOrderByRatingDesc();
    }
}
