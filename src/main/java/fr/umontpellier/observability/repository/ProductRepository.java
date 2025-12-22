package fr.umontpellier.observability.repository;

import fr.umontpellier.observability.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByExpirationDateBefore(LocalDate date);

    List<Product> findByExpirationDateAfter(LocalDate date);
}
