import ProductPage, { getServerSideProps as getSharedProductPageServerSideProps } from "../../product/[id]";

export default ProductPage;
export const getServerSideProps = getSharedProductPageServerSideProps;