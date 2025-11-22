//
//  NetworkManager.swift
//  SplitTab
//
//  Core networking manager
//

import Foundation

class NetworkManager {
    static let shared = NetworkManager()

    private var session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 300
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData

        self.session = URLSession(configuration: configuration)

        // Configure JSON decoder
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            let formatters = [
                ISO8601DateFormatter(),
                {
                    let formatter = DateFormatter()
                    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
                    return formatter
                }(),
                {
                    let formatter = DateFormatter()
                    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
                    return formatter
                }()
            ]

            for formatter in formatters {
                if let isoFormatter = formatter as? ISO8601DateFormatter,
                   let date = isoFormatter.date(from: dateString) {
                    return date
                } else if let dateFormatter = formatter as? DateFormatter,
                          let date = dateFormatter.date(from: dateString) {
                    return date
                }
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string \(dateString)"
            )
        }

        // Configure JSON encoder
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func configure() {
        // Additional configuration if needed
    }

    // MARK: - Request Methods

    func request<T: Codable>(
        _ endpoint: APIEndpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        let request = try await buildRequest(endpoint, method: method, body: body, requiresAuth: requiresAuth)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        // Handle HTTP status codes
        try handleHTTPResponse(httpResponse, data: data)

        // Decode response
        do {
            let apiResponse = try decoder.decode(APIResponse<T>.self, from: data)
            if let data = apiResponse.data {
                return data
            } else {
                throw NetworkError.emptyResponse
            }
        } catch {
            print("Decoding error: \(error)")
            throw NetworkError.decodingError(error)
        }
    }

    func requestPaginated<T: Codable>(
        _ endpoint: APIEndpoint,
        page: Int = 1,
        limit: Int = 20,
        requiresAuth: Bool = true
    ) async throws -> PaginatedResponse<T> {
        var endpoint = endpoint
        endpoint.queryItems = (endpoint.queryItems ?? []) + [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        let request = try await buildRequest(endpoint, method: .get, body: nil as String?, requiresAuth: requiresAuth)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        try handleHTTPResponse(httpResponse, data: data)

        do {
            return try decoder.decode(PaginatedResponse<T>.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }

    func requestEmpty(
        _ endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws {
        let request = try await buildRequest(endpoint, method: method, body: body, requiresAuth: requiresAuth)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        try handleHTTPResponse(httpResponse, data: data)
    }

    // MARK: - Upload

    func upload<T: Codable>(
        _ endpoint: APIEndpoint,
        fileData: Data,
        fileName: String,
        mimeType: String
    ) async throws -> T {
        let boundary = UUID().uuidString
        var request = try await buildRequest(endpoint, method: .post, body: nil as String?, requiresAuth: true)
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()

        // Add file data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        try handleHTTPResponse(httpResponse, data: data)

        let apiResponse = try decoder.decode(APIResponse<T>.self, from: data)
        if let data = apiResponse.data {
            return data
        } else {
            throw NetworkError.emptyResponse
        }
    }

    // MARK: - Private Helpers

    private func buildRequest(
        _ endpoint: APIEndpoint,
        method: HTTPMethod,
        body: Encodable?,
        requiresAuth: Bool
    ) async throws -> URLRequest {
        guard let url = endpoint.url else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add authentication token
        if requiresAuth {
            if let token = await TokenManager.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        }

        // Add request body
        if let body = body {
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }

        return request
    }

    private func handleHTTPResponse(_ response: HTTPURLResponse, data: Data) throws {
        switch response.statusCode {
        case 200...299:
            return
        case 401:
            // Try to refresh token
            Task {
                await AuthenticationService.shared.refreshTokenIfNeeded()
            }
            throw NetworkError.unauthorized
        case 400...499:
            // Try to decode error response
            if let apiError = try? decoder.decode(APIError.self, from: data) {
                throw apiError
            }
            throw NetworkError.clientError(response.statusCode)
        case 500...599:
            throw NetworkError.serverError(response.statusCode)
        default:
            throw NetworkError.unknown(response.statusCode)
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - Network Error

enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case clientError(Int)
    case serverError(Int)
    case unknown(Int)
    case decodingError(Error)
    case emptyResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized. Please login again."
        case .clientError(let code):
            return "Client error: \(code)"
        case .serverError(let code):
            return "Server error: \(code)"
        case .unknown(let code):
            return "Unknown error: \(code)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .emptyResponse:
            return "Empty response from server"
        }
    }
}

// MARK: - AnyEncodable Helper

private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init<T: Encodable>(_ wrapped: T) {
        _encode = wrapped.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}
