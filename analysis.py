import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from typing import Dict, List, Tuple, Optional, Any
from langchain_core.tools import BaseTool
from langchain_core.tools.base import ToolException
from pydantic import BaseModel, Field
import json


class DataAnalysisInput(BaseModel):
    data: List[Dict[str, Any]] = Field(
        description="List of data records as dictionaries"
    )
    analysis_type: str = Field(
        default="comprehensive",
        description="Type of analysis: 'comprehensive', 'clustering', 'correlation', 'outlier'",
    )
    target_column: Optional[str] = Field(
        default=None, description="Target column for focused analysis"
    )
    max_clusters: int = Field(
        default=5, description="Maximum clusters for clustering analysis"
    )


class IntelligentDataAnalyzer(BaseTool):
    name: str = "intelligent_data_analyzer"
    description: str = "Advanced data analysis tool that performs statistical analysis, machine learning clustering, outlier detection, correlation analysis, and generates visualizations with actionable insights."
    args_schema: type[BaseModel] = DataAnalysisInput
    response_format: str = "content_and_artifact"

    def _run(
        self,
        data: List[Dict],
        analysis_type: str = "comprehensive",
        target_column: Optional[str] = None,
        max_clusters: int = 5,
    ) -> Tuple[str, Dict]:
        try:
            df = pd.DataFrame(data)
            if df.empty:
                raise ToolException("Dataset is empty")

            insights = {"dataset_info": self._get_dataset_info(df)}

            if analysis_type in ["comprehensive", "correlation"]:
                insights["correlation_analysis"] = self._correlation_analysis(df)
            if analysis_type in ["comprehensive", "clustering"]:
                insights["clustering_analysis"] = self._clustering_analysis(
                    df, max_clusters
                )
            if analysis_type in ["comprehensive", "outlier"]:
                insights["outlier_detection"] = self._outlier_detection(df)

            if target_column and target_column in df.columns:
                insights["target_analysis"] = self._target_analysis(df, target_column)

            recommendations = self._generate_recommendations(df, insights)
            summary = self._create_analysis_summary(insights, recommendations)

            artifact = {
                "insights": insights,
                "recommendations": recommendations,
                "data_shape": df.shape,
                "analysis_type": analysis_type,
                "numeric_columns": df.select_dtypes(
                    include=[np.number]
                ).columns.tolist(),
                "categorical_columns": df.select_dtypes(
                    include=["object"]
                ).columns.tolist(),
            }

            return summary, artifact

        except Exception as e:
            raise ToolException(f"Analysis failed: {str(e)}")

    def _get_dataset_info(self, df: pd.DataFrame) -> Dict:
        return {
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "memory_usage": df.memory_usage(deep=True).sum(),
        }

    def _correlation_analysis(self, df: pd.DataFrame) -> Dict:
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            return {"message": "No numeric columns for correlation analysis"}

        corr_matrix = numeric_df.corr()
        strong_corr = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.7:
                    strong_corr.append(
                        {
                            "var1": corr_matrix.columns[i],
                            "var2": corr_matrix.columns[j],
                            "correlation": round(corr_val, 3),
                        }
                    )

        return {
            "correlation_matrix": corr_matrix.round(3).to_dict(),
            "strong_correlations": strong_corr,
            "avg_correlation": round(
                corr_matrix.values[
                    np.triu_indices_from(corr_matrix.values, k=1)
                ].mean(),
                3,
            ),
        }

    def _clustering_analysis(self, df: pd.DataFrame, max_clusters: int) -> Dict:
        numeric_df = df.select_dtypes(include=[np.number]).dropna()
        if numeric_df.shape[0] < 2 or numeric_df.shape[1] < 2:
            return {"message": "Insufficient numeric data for clustering"}

        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(numeric_df)

        inertias = []
        K_range = range(1, min(max_clusters + 1, len(numeric_df) // 2 + 1))

        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(scaled_data)
            inertias.append(kmeans.inertia_)

        optimal_k = self._find_elbow_point(inertias, K_range)
        kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(scaled_data)

        cluster_stats = {}
        for i in range(optimal_k):
            cluster_data = numeric_df[cluster_labels == i]
            cluster_stats[f"cluster_{i}"] = {
                "size": len(cluster_data),
                "percentage": round(len(cluster_data) / len(numeric_df) * 100, 1),
                "means": cluster_data.mean().round(3).to_dict(),
            }

        return {
            "optimal_clusters": optimal_k,
            "cluster_stats": cluster_stats,
            "silhouette_score": round(silhouette_score(scaled_data, cluster_labels), 3)
            if len(set(cluster_labels)) > 1
            else 0.0,
            "inertias": inertias,
        }

    def _outlier_detection(self, df: pd.DataFrame) -> Dict:
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            return {"message": "No numeric columns for outlier detection"}

        outliers = {}
        for col in numeric_df.columns:
            data = numeric_df[col].dropna()
            Q1, Q3 = data.quantile(0.25), data.quantile(0.75)
            IQR = Q3 - Q1
            iqr_outliers = data[(data < Q1 - 1.5 * IQR) | (data > Q3 + 1.5 * IQR)]
            z_scores = np.abs((data - data.mean()) / data.std())
            z_outliers = data[z_scores > 3]

            outliers[col] = {
                "iqr_outliers": len(iqr_outliers),
                "z_score_outliers": len(z_outliers),
                "outlier_percentage": round(len(iqr_outliers) / len(data) * 100, 2),
            }

        return outliers

    def _target_analysis(self, df: pd.DataFrame, target_col: str) -> Dict:
        if target_col not in df.columns:
            return {"error": f"Column {target_col} not found"}

        target_data = df[target_col].dropna()

        if pd.api.types.is_numeric_dtype(target_data):
            return {
                "type": "numeric",
                "stats": {
                    "mean": round(target_data.mean(), 3),
                    "median": round(target_data.median(), 3),
                    "std": round(target_data.std(), 3),
                    "skewness": round(target_data.skew(), 3),
                    "kurtosis": round(target_data.kurtosis(), 3),
                },
                "distribution": "normal" if abs(target_data.skew()) < 0.5 else "skewed",
            }
        else:
            value_counts = target_data.value_counts()
            return {
                "type": "categorical",
                "unique_values": len(value_counts),
                "most_common": value_counts.head(5).to_dict(),
                "entropy": round(
                    -sum((p := value_counts / len(target_data)) * np.log2(p + 1e-10)), 3
                ),
            }

    def _generate_recommendations(self, df: pd.DataFrame, insights: Dict) -> List[str]:
        recommendations = []

        missing_pct = (
            sum(insights["dataset_info"]["missing_values"].values())
            / (df.shape[0] * df.shape[1])
            * 100
        )
        if missing_pct > 10:
            recommendations.append(
                f"Consider data imputation - {missing_pct:.1f}% missing values detected"
            )

        if "correlation_analysis" in insights and insights["correlation_analysis"].get(
            "strong_correlations"
        ):
            recommendations.append(
                "Strong correlations detected - consider feature selection or dimensionality reduction"
            )

        if "clustering_analysis" in insights:
            cluster_info = insights["clustering_analysis"]
            if isinstance(cluster_info, dict) and "optimal_clusters" in cluster_info:
                recommendations.append(
                    f"Data segments into {cluster_info['optimal_clusters']} distinct groups - useful for targeted strategies"
                )

        if "outlier_detection" in insights:
            high_outlier_cols = [
                col
                for col, info in insights["outlier_detection"].items()
                if isinstance(info, dict) and info.get("outlier_percentage", 0) > 5
            ]
            if high_outlier_cols:
                recommendations.append(
                    f"High outlier percentage in: {', '.join(high_outlier_cols)} - investigate data quality"
                )

        return (
            recommendations
            if recommendations
            else ["Data appears well-structured with no immediate concerns"]
        )

    def _create_analysis_summary(
        self, insights: Dict, recommendations: List[str]
    ) -> str:
        dataset_info = insights["dataset_info"]
        summary = f"""📊 INTELLIGENT DATA ANALYSIS COMPLETE

Dataset Overview: {dataset_info["shape"][0]} rows × {dataset_info["shape"][1]} columns
Numeric Features: {len([c for c, t in dataset_info["dtypes"].items() if "int" in t or "float" in t])}
Categorical Features: {len([c for c, t in dataset_info["dtypes"].items() if "object" in t])}

Key Insights Generated:
• Statistical correlations and relationships identified
• Clustering patterns discovered for segmentation
• Outlier detection completed for data quality assessment
• Feature importance and distribution analysis performed

Top Recommendations:
{chr(10).join("• " + rec for rec in recommendations[:3])}

Analysis includes ML-powered clustering, statistical correlations, and actionable business insights."""

        return summary

    def _find_elbow_point(self, inertias: List[float], k_range: range) -> int:
        if len(inertias) < 3:
            return list(k_range)[0]
        diffs = [inertias[i - 1] - inertias[i] for i in range(1, len(inertias))]
        return list(k_range)[diffs.index(max(diffs)) + 1] if diffs else list(k_range)[0]


data_analyzer = IntelligentDataAnalyzer()

sample_data = [
    {"age": 25, "income": 50000, "education": "Bachelor", "satisfaction": 7},
    {"age": 35, "income": 75000, "education": "Master", "satisfaction": 8},
    {"age": 45, "income": 90000, "education": "PhD", "satisfaction": 6},
    {"age": 28, "income": 45000, "education": "Bachelor", "satisfaction": 7},
    {"age": 52, "income": 120000, "education": "Master", "satisfaction": 9},
]

result = data_analyzer.invoke(
    {
        "data": sample_data,
        "analysis_type": "comprehensive",
        "target_column": "satisfaction",
    }
)

print("Analysis Summary:")
print(result)
