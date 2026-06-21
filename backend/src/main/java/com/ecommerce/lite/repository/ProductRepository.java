package com.ecommerce.lite.repository;

import com.ecommerce.lite.model.Category;
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
    @Query("SELECT p FROM Product p " +
           "LEFT JOIN p.category c " +
           "LEFT JOIN c.parent pc WHERE " +
           "(c.id = :categoryId OR pc.id = :categoryId) AND " +
           "(REPLACE(REPLACE(LOWER(p.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(p.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt)) OR " +
           "(c.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(c.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(c.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt)))) OR " +
           "(pc.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(pc.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(pc.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt)))))")
    Page<Product> searchByCategoryAndSearch(@Param("categoryId") Long categoryId, @Param("search") String search, @Param("searchAlt") String searchAlt, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "p.category.id = :categoryId OR p.category.parent.id = :categoryId")
    Page<Product> searchByCategory(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p " +
           "LEFT JOIN p.category c " +
           "LEFT JOIN c.parent pc WHERE " +
           "REPLACE(REPLACE(LOWER(p.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(p.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt)) OR " +
           "(c.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(c.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(c.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt)))) OR " +
           "(pc.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(pc.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(pc.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt))))")
    Page<Product> searchByText(@Param("search") String search, @Param("searchAlt") String searchAlt, Pageable pageable);

    @Query("SELECT DISTINCT c FROM Product p " +
           "INNER JOIN p.category c " +
           "LEFT JOIN c.parent pc WHERE " +
           "REPLACE(REPLACE(LOWER(p.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(p.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(p.name), '-', '') LIKE CONCAT('% ', :searchAlt)) OR " +
           "(c.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(c.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(c.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(c.name), '-', '') LIKE CONCAT('% ', :searchAlt)))) OR " +
           "(pc.name IS NOT NULL AND (REPLACE(REPLACE(LOWER(pc.name), '-', ''), ' ', '') LIKE :search OR " +
           "(REPLACE(LOWER(pc.name), '-', '') = :searchAlt OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT(:searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt, ' %') OR " +
           "REPLACE(LOWER(pc.name), '-', '') LIKE CONCAT('% ', :searchAlt))))")
    List<Category> findCategoriesBySearchText(@Param("search") String search, @Param("searchAlt") String searchAlt);

    List<Product> findTop5ByOrderByRatingDesc();
    List<Product> findTop5ByCategoryIdAndIdNot(Long categoryId, Long id);
    long countByStockLessThanEqual(int stock);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM reviews WHERE product_id = :productId", nativeQuery = true)
    void deleteReviewsByProductId(@Param("productId") Long productId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM cart_items WHERE product_id = :productId", nativeQuery = true)
    void deleteCartItemsByProductId(@Param("productId") Long productId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM order_items WHERE product_id = :productId", nativeQuery = true)
    void deleteOrderItemsByProductId(@Param("productId") Long productId);
}
