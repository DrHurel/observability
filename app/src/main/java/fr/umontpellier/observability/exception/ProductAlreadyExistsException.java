package fr.umontpellier.observability.exception;

public class ProductAlreadyExistsException extends RuntimeException {
    public ProductAlreadyExistsException(String id) {
        super("Product already exists with id: " + id);
    }
}
