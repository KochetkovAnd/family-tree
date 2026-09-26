package com.kochetkov.familytree.repository;

import com.kochetkov.familytree.entity.FamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, Long> {
}