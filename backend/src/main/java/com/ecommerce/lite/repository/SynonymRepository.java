package com.ecommerce.lite.repository;

import com.ecommerce.lite.model.Synonym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SynonymRepository extends JpaRepository<Synonym, Long> {
    @Query("SELECT s FROM Synonym s WHERE LOWER(s.term) = LOWER(:term) OR LOWER(s.synonym) = LOWER(:term)")
    List<Synonym> findByTermOrSynonymIgnoreCase(@Param("term") String term);
}
