create schema if not exists carboneum collate utf8_unicode_ci;

create table if not exists orderhash
(
    id                int auto_increment
        primary key,
    leader            varchar(44) null,
    follower          varchar(44) null,
    followerOrderHash varchar(66) null,
    leaderTxHash      varchar(66) null
);

create table if not exists sent_order
(
    id             int auto_increment
        primary key,
    leader         varchar(44)                         null,
    follower       varchar(44)                         null,
    leader_tx_hash varchar(66)                         null,
    order_hash     varchar(66)                         null,
    order_time     timestamp default CURRENT_TIMESTAMP null,
    isCancel       varchar(3)                          null,
    filled         varchar(100)                        null,
    initialAmount  varchar(100)                        null
);

create table if not exists subscription
(
    id        int auto_increment
        primary key,
    full_name varchar(256) charset utf8 null,
    phone     varchar(128) charset utf8 null,
    email     varchar(128) charset utf8 null,
    invest    varchar(256) charset utf8 null
);

create table if not exists topup_log
(
    id             int auto_increment
        primary key,
    wallet_address varchar(44)  null,
    token_address  varchar(44)  null,
    amount         varchar(256) null,
    type           varchar(20)  null,
    order_time     timestamp    null,
    txhash         varchar(66)  null
);

create table if not exists trade
(
    id             int auto_increment
        primary key,
    order_time     timestamp    null,
    leader         varchar(44)  null,
    follower       varchar(44)  null,
    maker_token    varchar(44)  null,
    taker_token    varchar(44)  null,
    amount_maker   varchar(256) null,
    amount_taker   varchar(256) null,
    amount_left    varchar(256) null,
    order_hash     varchar(66)  null,
    tx_hash        varchar(66)  null,
    leader_tx_hash varchar(66)  null
);

create index if not exists trade_amount_left_index
    on trade (amount_left);

create index if not exists trade_leader_follower_amount_left_index
    on trade (leader, follower, amount_left);

create index if not exists trade_order_hash_index
    on trade (order_hash);

create index if not exists trade_order_time_index
    on trade (order_time);

create index if not exists trade_tx_hash_index
    on trade (tx_hash);

create table if not exists trade_log
(
    id          int auto_increment
        primary key,
    token_maker varchar(44)                         null,
    token_taker varchar(44)                         null,
    amount_buy  varchar(256)                        null,
    amount_sell varchar(256)                        null,
    tx_leader   varchar(66)                         null,
    txhash      varchar(66)                         null,
    order_time  timestamp default CURRENT_TIMESTAMP not null,
    maker       varchar(44)                         null,
    taker       varchar(44)                         null
);

create table if not exists user
(
    address      varchar(42)                           not null,
    exchange     varchar(64)                           not null,
    apiKey       varchar(256)                          null,
    apiSecret    varchar(256)                          null,
    registerDate datetime    default CURRENT_TIMESTAMP null,
    type         varchar(10) default 'follower'        null,
    primary key (address, exchange)
);
