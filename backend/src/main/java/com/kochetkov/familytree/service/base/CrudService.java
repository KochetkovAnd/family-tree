package com.kochetkov.familytree.service.base;

import java.util.List;

public interface CrudService<DTO> {
    List<DTO> findAll();
    DTO findById(Long id);
    DTO create(DTO dto);
    DTO update(DTO dto);
    void deleteById(Long id);
}
