package com.ecommerce.lite.repository;

import com.ecommerce.lite.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p FROM Product p WHERE " +
           "(p.category.id = :categoryId OR p.category.parent.id = :categoryId) AND " +
           "(LOWER(p.name) LIKE :search OR LOWER(p.description) LIKE :search)")
    Page<Product> searchByCategoryAndSearch(@Param("categoryId") Long categoryId, @Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "p.category.id = :categoryId OR p.category.parent.id = :categoryId")
    Page<Product> searchByCategory(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE :search OR LOWER(p.description) LIKE :search")
    Page<Product> searchByText(@Param("search") String search, Pageable pageable);

    List<Product> findTop5ByOrderByRatingDesc();
    List<Product> findTop5ByCategoryIdAndIdNot(Long categoryId, Long id);
    long countByStockLessThanEqual(int stock);
}
