// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DigitalVaultIntegrityRegistry {
    enum FileStatus {
        ACTIVE,
        REVOKED,
        DELETED
    }

    struct FileRecord {
        string fileId;
        bytes32 sha256Hash;
        address ownerAddress;
        FileStatus status;
        uint256 timestamp;
    }

    address public admin;

    mapping(string => FileRecord) private fileRecords;

    event FileRegistered(
        string indexed fileId,
        bytes32 sha256Hash,
        address indexed ownerAddress,
        uint256 timestamp
    );

    event FileHashUpdated(
        string indexed fileId,
        bytes32 sha256Hash,
        uint256 timestamp
    );

    event FileStatusUpdated(
        string indexed fileId,
        FileStatus status,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerFile(
        string calldata fileId,
        bytes32 sha256Hash,
        address ownerAddress
    ) external onlyAdmin {
        require(
            bytes(fileId).length > 0,
            "File ID is required"
        );

        require(
            ownerAddress != address(0),
            "Invalid owner address"
        );

        require(
            fileRecords[fileId].timestamp == 0,
            "File already registered"
        );

        fileRecords[fileId] = FileRecord({
            fileId: fileId,
            sha256Hash: sha256Hash,
            ownerAddress: ownerAddress,
            status: FileStatus.ACTIVE,
            timestamp: block.timestamp
        });

        emit FileRegistered(
            fileId,
            sha256Hash,
            ownerAddress,
            block.timestamp
        );
    }

    function updateHash(
        string calldata fileId,
        bytes32 newSha256Hash
    ) external onlyAdmin {
        require(
            fileRecords[fileId].timestamp != 0,
            "File record not found"
        );

        require(
            fileRecords[fileId].status != FileStatus.DELETED,
            "Deleted file cannot be updated"
        );

        fileRecords[fileId].sha256Hash = newSha256Hash;
        fileRecords[fileId].timestamp = block.timestamp;

        emit FileHashUpdated(
            fileId,
            newSha256Hash,
            block.timestamp
        );
    }

    function updateStatus(
        string calldata fileId,
        FileStatus newStatus
    ) external onlyAdmin {
        require(
            fileRecords[fileId].timestamp != 0,
            "File record not found"
        );

        fileRecords[fileId].status = newStatus;
        fileRecords[fileId].timestamp = block.timestamp;

        emit FileStatusUpdated(
            fileId,
            newStatus,
            block.timestamp
        );
    }

    function getFileRecord(
        string calldata fileId
    )
        external
        view
        returns (
            string memory,
            bytes32,
            address,
            FileStatus,
            uint256
        )
    {
        require(
            fileRecords[fileId].timestamp != 0,
            "File record not found"
        );

        FileRecord memory record = fileRecords[fileId];

        return (
            record.fileId,
            record.sha256Hash,
            record.ownerAddress,
            record.status,
            record.timestamp
        );
    }
}