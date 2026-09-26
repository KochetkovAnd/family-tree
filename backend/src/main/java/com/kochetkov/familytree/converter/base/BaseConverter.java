package com.kochetkov.familytree.converter.base;

import com.kochetkov.familytree.dto.auth.base.BaseIdEntityDTO;
import com.kochetkov.familytree.entity.base.BaseIdEntity;

import java.util.List;

public interface BaseConverter<Entity extends BaseIdEntity, DTO extends BaseIdEntityDTO> {
    Entity toEntity(DTO dto);

    /**
     * Copies {@code dto}'s fields onto an EXISTING managed {@code entity} instead of
     * creating a new one — this is what {@code update} must use instead of
     * {@link #toEntity(BaseIdEntityDTO)}. See {@code AbstractConverter} for why.
     */
    Entity toEntity(DTO dto, Entity entity);

    DTO toDTO(Entity entity);
    List<Entity> toListEntity(List<DTO> dtoList);
    List<DTO> toListDTO(List<Entity> entityList);
}
