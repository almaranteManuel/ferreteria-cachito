// Utilidades solo para tests del módulo arca.

use openssl::asn1::Asn1Time;
use openssl::bn::{BigNum, MsbOption};
use openssl::hash::MessageDigest;
use openssl::pkey::{PKey, Private};
use openssl::rsa::Rsa;
use openssl::x509::{X509NameBuilder, X509};
use std::fs;
use std::path::PathBuf;

pub fn dir_test(nombre: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("arca-test-{}-{}", nombre, std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).expect("crear dir temporal");
    d
}

pub fn generar_clave() -> PKey<Private> {
    PKey::from_rsa(Rsa::generate(2048).unwrap()).unwrap()
}

pub fn self_signed_para(cn: &str, clave: &PKey<Private>) -> X509 {
    let mut nb = X509NameBuilder::new().unwrap();
    nb.append_entry_by_text("CN", cn).unwrap();
    let name = nb.build();

    let mut n = BigNum::new().unwrap();
    n.rand(64, MsbOption::MAYBE_ZERO, false).unwrap();
    let serial = n.to_asn1_integer().unwrap();

    let mut b = X509::builder().unwrap();
    b.set_version(2).unwrap();
    b.set_subject_name(&name).unwrap();
    b.set_issuer_name(&name).unwrap();
    b.set_serial_number(&serial).unwrap();
    let not_before = Asn1Time::days_from_now(0).unwrap();
    let not_after = Asn1Time::days_from_now(365).unwrap();
    b.set_not_before(&not_before).unwrap();
    b.set_not_after(&not_after).unwrap();
    b.set_pubkey(clave).unwrap();
    b.sign(clave, MessageDigest::sha256()).unwrap();
    b.build()
}
