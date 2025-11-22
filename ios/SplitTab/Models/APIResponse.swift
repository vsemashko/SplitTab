//
//  APIResponse.swift
//  SplitTab
//
//  Standard API response models
//

import Foundation

// MARK: - Success Response

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let meta: ResponseMeta?

    enum CodingKeys: String, CodingKey {
        case success
        case data
        case meta
    }
}

struct ResponseMeta: Codable {
    let timestamp: String
    let requestId: String?

    enum CodingKeys: String, CodingKey {
        case timestamp
        case requestId = "request_id"
    }
}

// MARK: - Error Response

struct APIError: Codable, Error {
    let success: Bool
    let error: ErrorDetail
    let meta: ResponseMeta?

    var localizedDescription: String {
        error.message
    }
}

struct ErrorDetail: Codable {
    let code: String
    let message: String
    let details: [ErrorDetailItem]?
}

struct ErrorDetailItem: Codable {
    let field: String?
    let message: String
}

// MARK: - Paginated Response

struct PaginatedResponse<T: Codable>: Codable {
    let success: Bool
    let data: [T]
    let pagination: Pagination
    let meta: ResponseMeta?
}

struct Pagination: Codable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
    let hasNext: Bool
    let hasPrevious: Bool

    enum CodingKeys: String, CodingKey {
        case page
        case limit
        case total
        case totalPages = "total_pages"
        case hasNext = "has_next"
        case hasPrevious = "has_previous"
    }
}

// MARK: - Empty Response

struct EmptyResponse: Codable {
    let success: Bool
}
